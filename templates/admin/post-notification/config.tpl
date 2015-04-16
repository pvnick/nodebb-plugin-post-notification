<h1><i class="fa fa-envelope-o"></i>Post Notification</h1>

<div class="row">
	<div class="col-lg-12">
		<blockquote>
			This plugin lets NodeBB send an email notification whenever a post is saved.
		</blockquote>
	</div>
</div>

<hr />

<form role="form">
	<fieldset>
		<div class="row">
			<div class="col-sm-12">
				<div class="form-group">
					<label for="postnotification:emails">Emails (comma-delimited)</label>
					<input type="text" class="form-control" id="postnotification:emails" data-field="postnotification:emails" />
				</div>
			</div>
		</div>

		<button class="btn btn-lg btn-primary" id="save">Save</button>
	</fieldset>
</form>

<script type="text/javascript">
	require(['admin/settings'], function(Settings) {
		Settings.prepare();
	});
</script>
